import time, os, torch
from transformers import Wav2Vec2ForCTC

os.chdir(os.path.dirname(os.path.abspath(__file__)))
os.makedirs("onnx_out", exist_ok=True)

print("loading model (downloads ~1.26GB fp32)…", flush=True)
m = Wav2Vec2ForCTC.from_pretrained("facebook/wav2vec2-lv-60-espeak-cv-ft")
m.eval()

print("exporting to ONNX…", flush=True)
dummy = torch.randn(1, 48000)
with torch.no_grad():
    torch.onnx.export(
        m, dummy, "onnx_out/model.onnx",
        input_names=["input_values"], output_names=["logits"],
        dynamic_axes={"input_values": {1: "seq"}, "logits": {1: "frames"}},
        opset_version=14,
    )
print(f"fp32 onnx: {os.path.getsize('onnx_out/model.onnx')/1048576:.1f} MB", flush=True)

print("quantizing int8…", flush=True)
from onnxruntime.quantization import quantize_dynamic, QuantType
quantize_dynamic("onnx_out/model.onnx", "onnx_out/model_quantized.onnx", weight_type=QuantType.QInt8)
print(f"int8 onnx: {os.path.getsize('onnx_out/model_quantized.onnx')/1048576:.1f} MB", flush=True)
print("DONE2", flush=True)
