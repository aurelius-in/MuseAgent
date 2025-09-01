from museagent.backend.agents.embedding_agent import EmbeddingIndex
import numpy as np


def test_topk_returns_list():
    idx = EmbeddingIndex(dim=4)
    a = np.zeros(4, dtype=np.float32)
    b = np.ones(4, dtype=np.float32)
    idx.add("a", a)
    idx.add("b", b)
    out = idx.topk("a", 1)
    assert isinstance(out, list)


