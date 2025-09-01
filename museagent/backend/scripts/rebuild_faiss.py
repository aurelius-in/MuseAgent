from museagent.backend.agents.embedding_agent import EmbeddingIndex


def main():
    idx = EmbeddingIndex(dim=1024)
    idx.rebuild()
    print({"status": "ok", "ntotal": getattr(idx._faiss_index, 'ntotal', 'mem')})


if __name__ == "__main__":
    main()


