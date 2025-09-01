from museagent.backend.agents.feature_agent import extract_features


def test_extract_features_shape():
    d = extract_features("/tmp/none.wav")
    feats = d["features"]
    assert len(feats["mfcc_mean"]) == 13
    assert len(feats["mfcc_std"]) == 13
    assert len(feats["chroma_mean"]) == 12
    assert len(feats["spectral_contrast"]) == 7
    assert len(feats["tonnetz"]) == 6


