import urllib.request
import json

url = "http://127.0.0.1:5000/api/register"
data = json.dumps({
    "username": "tamil2",
    "email": "tamil51526@gmail.com",
    "password": "password123"
}).encode("utf-8")

req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
try:
    with urllib.request.urlopen(req) as response:
        print("Status:", response.status)
        print("Headers:", response.headers)
        print("Body:", response.read().decode("utf-8"))
except urllib.error.HTTPError as e:
    print("HTTP Error:", e.code)
    print("Headers:", e.headers)
    print("Body:", e.read().decode("utf-8"))
except Exception as e:
    print("Error:", e)
