from museagent.backend.agents.embedding_agent import EmbeddingIndex
import numpy as np


def test_index_add_and_topk():
    idx = EmbeddingIndex(dim=8)
    a = np.eye(8, dtype=np.float32)[0]
    b = np.eye(8, dtype=np.float32)[1]
    idx.add("a", a)
    idx.add("b", b)
    out = idx.topk("a", 1)
    assert isinstance(out, list)
    assert len(out) == 1

