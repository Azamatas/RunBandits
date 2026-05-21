#!/bin/bash
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login -H 'Content-Type: application/json' -d '{"email":"test@test.com","password":"Testpass123"}' | python3 -c 'import sys,json; print(json.load(sys.stdin)["access_token"])')
curl -s -X POST http://localhost:8000/segments/ -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"name":"Vondelpark Loop","polyline":"{cq~Hw{u\\oFrSsI~MoKzE{JcLcB{TzE_SjM_IvLvBrIvQ"}'
