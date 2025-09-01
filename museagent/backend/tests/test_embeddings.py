from museagent.backend.agents.embedding_agent import embed_from_file


def test_embed_dim():
    vec, tid = embed_from_file("/tmp/none.wav")
    assert len(vec) == 1024
    assert isinstance(tid, str)


