import pandas as pd
from pymilvus import (
    connections,
    FieldSchema, CollectionSchema, DataType,
    Collection,
    utility
)
from sentence_transformers import SentenceTransformer

# ---------------- 配置 ----------------
MILVUS_HOST = "localhost"
MILVUS_PORT = "19530"
COLLECTION_NAME = "security_incidents"
EMBEDDING_DIM = 384
CSV_FILE = "./incident_history.csv"

# ---------------- 连接 Milvus ----------------
connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT)

# ---------------- 读取 CSV ----------------
df = pd.read_csv(CSV_FILE)
print(f"Loaded {len(df)} incidents from CSV: {CSV_FILE}")

# ---------------- 加载 embedding 模型 ----------------
print("Loading embedding model...")
model = SentenceTransformer("all-MiniLM-L6-v2")

# ---------------- 生成 embedding ----------------
embeddings = model.encode(df['description'].tolist(), show_progress_bar=True)
print(f"Embedding dimension: {len(embeddings[0])}")

# ---------------- 删除旧 collection ----------------
if COLLECTION_NAME in utility.list_collections():
    old_col = Collection(COLLECTION_NAME)
    old_col.drop()
    print(f"Dropped existing collection: {COLLECTION_NAME}")

# ---------------- 定义 schema ----------------
fields = [
    FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=False),
    FieldSchema(name="title", dtype=DataType.VARCHAR, max_length=500),
    FieldSchema(name="description", dtype=DataType.VARCHAR, max_length=2000),
    FieldSchema(name="analyst", dtype=DataType.VARCHAR, max_length=100),
    FieldSchema(name="department", dtype=DataType.VARCHAR, max_length=100),
    FieldSchema(name="contact", dtype=DataType.VARCHAR, max_length=200),
    FieldSchema(name="resolution", dtype=DataType.VARCHAR, max_length=2000),
    FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=EMBEDDING_DIM),
]

schema = CollectionSchema(fields, description="Security incidents collection")

# ---------------- 创建 collection ----------------
collection = Collection(name=COLLECTION_NAME, schema=schema)
print(f"Collection '{COLLECTION_NAME}' created.")

# ---------------- 准备插入数据 ----------------
entities = [
    df['id'].tolist(),
    df['title'].tolist(),
    df['description'].tolist(),
    df['analyst'].tolist(),
    df['department'].tolist(),
    df['contact'].tolist(),
    df['resolution'].tolist(),
    embeddings.tolist(),
]

# ---------------- 插入 ----------------
collection.insert(entities)
print(f"Inserted {len(df)} incidents into collection '{COLLECTION_NAME}'")

# ---------------- 创建索引（可选，但推荐） ----------------
from pymilvus import Index

index_params = {
    "index_type": "IVF_FLAT",
    "metric_type": "IP",
    "params": {"nlist": 128}
}

collection.create_index(field_name="embedding", index_params=index_params)
collection.load()
print(f"Index created and collection loaded for search.")
