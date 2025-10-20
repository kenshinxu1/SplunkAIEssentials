#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import json
import requests
from splunklib.searchcommands import dispatch, StreamingCommand, Configuration, Option, validators
from pymilvus import connections, Collection
from sentence_transformers import SentenceTransformer

@Configuration()
class LLMRAGCommand(StreamingCommand):
    """
    StreamingCommand: RAG + LLM
    输出新增字段 answer、department、contact、matched_records，同时保留原始字段
    """

    prompt = Option(require=True, doc="用户输入的提示词")
    provider = Option(require=True, doc="LLM 提供者，目前支持 Ollama", validate=validators.Match("provider", r"^ollama$"))
    model = Option(require=True, doc="模型名称，如 llama3:latest")
    collection_name = Option(default="security_incidents", doc="Milvus collection 名称")
    debug = Option(default=False, validate=validators.Boolean())
    max_records = Option(default=5, validate=validators.Integer())

    MILVUS_HOST = "127.0.0.1"
    MILVUS_PORT = "19530"
    embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

    def stream(self, records):
        for record in records:
            # 保留原始字段
            event_value = record.get("event", "")

            # --- 1. RAG 检索上下文 ---
            context_records = self.retrieve_context(event_value, self.collection_name, debug=self.debug, limit=self.max_records)

            # --- 2. 构建 LLM Prompt ---
            if context_records:
                # 拼接上下文，保留所有字段
                context_str = "\n".join([
                    f"[Record {i+1}]\n" + "\n".join([f"{k}: {v}" for k, v in r.items() if k != "score"])
                    for i, r in enumerate(context_records)
                ])
                enhanced_prompt = (
                    "You are an experienced SOC analyst. "
                    "Based on the historical incidents below, determine which department or person should handle this security event. "
                    "Use the department and contact fields from the historical incidents.\n\n"
                    f"Context (historical incidents):\n{context_str}\n\n"
                    f"Question:\n{event_value}\n\n"
                    "Return your answer in JSON format:\n"
                    "{\n"
                    "  'responsible_department': '...',\n"
                    "  'responsible_contact': '...',\n"
                    "  'reasoning': '...'\n"
                    "}"
                )
            else:
                enhanced_prompt = event_value

            # --- 3. 调用 LLM ---
            response_text = self.call_llm(enhanced_prompt)

            # --- 4. 提取 top records 的 department/contact ---
            top_records = context_records[:2] if context_records else []
            department = ", ".join(set([r.get("department", "") for r in top_records if r.get("department")]))
            contact = ", ".join(set([r.get("contact", "") for r in top_records if r.get("contact")]))
            if not department: department = "N/A"
            if not contact: contact = "N/A"

            # --- 5. 输出，保留原始字段 + 新字段 ---
            output_record = dict(record)
            output_record.update({
                "answer": response_text,
                "department": department,
                "contact": contact,
                "matched_records": json.dumps(top_records, ensure_ascii=False)
            })

            yield output_record

    def retrieve_context(self, query, collection_name, debug=False, limit=5):
        try:
            connections.connect("default", host=self.MILVUS_HOST, port=self.MILVUS_PORT)
            collection = Collection(collection_name)
            collection.load()

            query_embedding = self.get_embedding(query)

            embedding_field = next((f for f in collection.schema.fields if "VECTOR" in f.dtype.name), None)
            if not embedding_field:
                if debug:
                    print("No vector field found in collection", file=sys.stderr)
                return []

            available_fields = [f.name for f in collection.schema.fields if "VECTOR" not in f.dtype.name]
            search_params = {"metric_type": "IP", "params": {"nprobe": 20}}
            results = collection.search(
                data=[query_embedding],
                anns_field=embedding_field.name,
                param=search_params,
                limit=limit,
                output_fields=available_fields
            )

            context_records = []
            for hits in results:
                for hit in hits:
                    record = {field: hit.entity.get(field, "") for field in available_fields}
                    record["score"] = float(hit.distance)
                    context_records.append(record)
                    if debug:
                        print(record, file=sys.stderr)

            return context_records

        except Exception as e:
            if debug:
                print(f"[Milvus Error] {str(e)}", file=sys.stderr)
            return []

    def get_embedding(self, text):
        return self.embedding_model.encode(text).tolist()

    def call_llm(self, prompt_text):
        url = "http://localhost:11434/api/chat"
        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt_text}],
            "stream": False
        }
        try:
            r = requests.post(url, json=payload, timeout=60)
            r.raise_for_status()
            data = r.json()
            return data.get("message", {}).get("content", "")
        except Exception as e:
            return f"LLM 调用失败: {str(e)}"


if __name__ == "__main__":
    dispatch(LLMRAGCommand, sys.argv, sys.stdin, sys.stdout, __name__)
