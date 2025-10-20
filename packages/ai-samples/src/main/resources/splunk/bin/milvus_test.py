from pymilvus import connections, Collection
from sentence_transformers import SentenceTransformer

# ---------------- 配置 ----------------
MILVUS_HOST = "127.0.0.1"
MILVUS_PORT = "19530"
COLLECTION_NAME = "security_incidents"

# 初始化 embedding 模型
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

# ---------------- 连接 Milvus ----------------
connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT)
collection = Collection(COLLECTION_NAME)
collection.load()

# ---------------- 打印 Collection 信息 ----------------
print(f"Collection name: {COLLECTION_NAME}")
print(f"Number of entities: {collection.num_entities}")
print("Schema fields:")
for field in collection.schema.fields:
    print(f"  - name: {field.name}, dtype: {field.dtype}")

# ---------------- 打印 sample 数据 ----------------
print("\nSample entities (first 3):")
for i, entity in enumerate(collection.query(limit=3, expr="")):
    print(f"{i+1}: {entity}")

# ---------------- 用户查询 ----------------
query_text = input("\nEnter query text: ")
query_embedding = embedding_model.encode(query_text).tolist()
print(f"Query embedding length: {len(query_embedding)}")

# ---------------- 获取 embedding 字段及维度 ----------------
embedding_field = None
for field in collection.schema.fields:
    if "VECTOR" in field.dtype.name:  # FLOAT_VECTOR 或 BINARY_VECTOR
        embedding_field = field
        break

if not embedding_field:
    raise ValueError("No vector field found in collection!")

# 获取维度
dim = getattr(embedding_field.dtype, "dim", None)
if dim is None:
    # pymilvus 新版本可能在 type.params
    dim = getattr(getattr(embedding_field, "type", None), "params", {}).get("dim", "Unknown")
print(f"Collection embedding dimension: {dim}")

# ---------------- 搜索 ----------------
search_params = {"metric_type": "IP", "params": {"nprobe": 20}}  # 可改为 L2
results = collection.search(
    data=[query_embedding],
    anns_field=embedding_field.name,
    param=search_params,
    limit=5,
    output_fields=["title", "description"]
)

# ---------------- 打印搜索结果 ----------------
print("\nSearch results:")
for i, hits in enumerate(results):
    print(f"\nQuery {i+1}:")
    if not hits:
        print("  No hits found")
    for hit in hits:
        title = hit.entity.get("title", "")
        desc = hit.entity.get("description", "")
        print(f"  id: {hit.id}, score: {hit.distance}, title: {title}, description: {desc}")
