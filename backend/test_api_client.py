import urllib.request
import json

with open("samples/good_standing.jpg", "rb") as f:
    file_bytes = f.read()

boundary = "----TestBoundary12345"
part1 = (
    f"--{boundary}\r\n"
    f'Content-Disposition: form-data; name="file"; filename="good_standing.jpg"\r\n'
    f"Content-Type: image/jpeg\r\n\r\n"
).encode("utf-8")
part2 = f"\r\n--{boundary}--\r\n".encode("utf-8")
data = part1 + file_bytes + part2

req = urllib.request.Request(
    "http://127.0.0.1:5000/api/analyze-image",
    data=data,
    headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}
)

with urllib.request.urlopen(req) as resp:
    res = json.loads(resp.read().decode("utf-8"))
    print("Analysis Success! ID:", res.get("id"))
    print("Category:", res.get("category"))
    print("Posture Score:", res.get("score"), "/ 100")
    print("CVA Angle:", res.get("angles", {}).get("craniovertebral_angle"))
    print("Trunk Inclination:", res.get("angles", {}).get("trunk_inclination"))
    print("Annotated Image Length:", len(res.get("annotated_image", "")))
    print("Mode:", res.get("mode"))
