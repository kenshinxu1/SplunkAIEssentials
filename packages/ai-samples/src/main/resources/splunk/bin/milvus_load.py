from pymilvus import connections, Collection

MILVUS_HOST = "localhost"
MILVUS_PORT = "19530"
COLLECTION_NAME = "security_incidents"

# 连接
connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT)

# 获取 collection
collection = Collection(COLLECTION_NAME)

# === 创建向量索引 ===
index_params = {
    "metric_type": "IP",  # 内积 (Inner Product)，也可用 "L2"
    "index_type": "HNSW",  # 或 IVF_FLAT、IVF_SQ8、AUTOINDEX
    "params": {"M": 8, "efConstruction": 64}
}

print("Creating vector index for 'embedding' field...")
collection.create_index(field_name="embedding", index_params=index_params)
print("✅ Index created successfully.")

# === 加载到内存 ===
collection.load()
print("✅ Collection loaded into memory, ready for search.")
