# 🛠️ Testing the Hospital Emergency Room Management System

Here you will find the list of cURLs to run in the terminal in order to test every service and their features and the APIs. 


## 🚹 Authentication Service

1. **User Registration**
```
curl -X POST http://localhost:8000/api/auth/register/ \
-H "Content-Type: application/json" \
-d '{
    "username": "newuser",
    "password": "pass123456",
    "email": "newuser@example.com",
    "first_name": "Mario",
    "last_name": "Rossi"
}'
```

2. **User Login**
```
curl -X POST http://localhost:8000/api/auth/login/ \
-H "Content-Type: application/json" \
-d '{
    "username": "newuser",
    "password": "pass123456"
}'
```

3. **User's details**
```
curl -X GET http://localhost:8000/api/auth/user/ \
-H "Authorization: Token YOUR_TOKEN_HERE"
```

4. **Users' list**
```
curl -X GET http://localhost:8000/api/auth/users/ \
-H "Authorization: Token YOUR_TOKEN_HERE"
```

5. **Token's details**
```
curl -X POST http://localhost:8000/api/auth/introspect/ \
-H "Content-Type: application/json" \
-d '{
    "token": "TOKEN_TO_BE_VERIFIED"
}'
```

## 🗂️ Inventory Service

1. **List of inventory items**
```
curl -X GET \
  -H "Authorization: Token <YOUR_TOKEN_HERE>" \
  http://localhost:8001/api/inventory/inventoryitems/
```

2. **Creation of a new item**
```
curl -X POST \
  -H "Authorization: Token <YOUR_TOKEN_HERE>" \
  -H "Content-Type: application/json" \
  -d '{
        "name": "cerotti",
        "category": "SUPP",
        "description": "10ml Luer Lock Syringes",
        "quantity": 500,
        "unit": "pieces",
        "minimum_stock": 100,
        "supplier": "MedSupply Co.",
        "location": "Storage Room B, Shelf 3",
        "expiry_date": "2026-01-31"
      }' \
  http://localhost:8001/api/inventory/inventoryitems/
```

3. **Retrieval of a specific item**
```
curl -X GET \
  -H "Authorization: Token <YOUR_TOKEN_HERE>" \
  http://localhost:8001/api/inventory/inventoryitems/1/
```

4. **Deletion of an item**
```
curl -X DELETE \
  -H "Authorization: Token <YOUR_TOKEN_HERE>" \
  http://localhost:8001/api/inventory/inventoryitems/1/
```

5. **List of low inventory items**
```
curl -X GET \
  -H "Authorization: Token <YOUR_TOKEN_HERE>" \
  http://localhost:8001/api/inventory/inventoryitems/low_stock/
```

## 📋 Patient Service

1. **List of all patients**
```
curl -X GET \
  -H "Authorization: Token <YOUR_TOKEN_HERE>" \
  http://localhost:8002/api/patients/
```

2. **Creation of a new patient**
```
curl -X POST \
  -H "Authorization: Token <YOUR_TOKEN_HERE>" \
  -H "Content-Type: application/json" \
  -d '{
        "first_name": "Luigi",
        "last_name": "Verdi",
        "date_of_birth": "1985-07-20",
        "gender": "M",
        "address": "Via Roma 1, 00100 Roma",
        "phone_number": "3331234567",
        "emergency_contact_name": "Luisa Verdi",
        "emergency_contact_phone": "3337654321",
        "blood_type": "A+",
        "allergies": "Nessuna nota",
        "pre_existing_conditions": "Ipertensione lieve",
        "insurance_info": "Assicurazione XYZ, Polizza #98765"
      }' \
  http://localhost:8002/api/patients/
```

3. **Retrieval of a specific patient**
```
curl -X GET \
  -H "Authorization: Token <YOUR_TOKEN_HERE>" \
  http://localhost:8002/api/patients/1/
```

## 🩺 Staff Service 

1. **List of the staff members**
```
curl -X GET \
  -H "Authorization: Token <YOUR_TOKEN_HERE>" \
  http://localhost:8003/api/staff/
```

2. **Creation of a new staff member**
```
curl -X POST \
  -H "Authorization: Token <YOUR_TOKEN_HERE>" \
  -H "Content-Type: application/json" \
  -d '{
        "user_id": 123,
        "role": "TEC",
        "department": "Information Technology",
        "hire_date": "2023-01-15",
        "license_number": "TECHLIC789",
        "specialization": "Network Support",
        "shift_schedule": "Mon-Fri 9am-5pm"
      }' \
  http://localhost:8003/api/staff/
```

3. **Retrieval of a specific staff member**
```
curl -X GET \
  -H "Authorization: Token <YOUR_TOKEN_HERE>" \
  http://localhost:8003/api/staff/1/
```

4. **Deletion of a specific staff member**
```
curl -X DELETE \
  -H "Authorization: Token <YOUR_TOKEN_HERE>" \
  http://localhost:8003/api/staff/1/
```

## 📑 Visit Service

1. **List of all emergencies visits**
```
curl -X GET \
  -H "Authorization: Token <YOUR_TOKEN_HERE>" \
  http://localhost:8004/api/emergency-visits/
```

1. 1 **List of all emergencies visit with a filter applied**
 ```
curl -X GET \
-H "Authorization: Token <YOUR_TOKEN_HERE>" \
"http://localhost:8004/api/emergency-visits/?patient_id=123&triage_level=2"
```

1. 2 **List of all emergencies with a specific words search**
```
curl -X GET \
  -H "Authorization: Token <YOUR_TOKEN_HERE>" \
  "http://localhost:8004/api/emergency-visits/?search=dolore%20toracico"
```

2. **Creation of a new emergency visit**
```
curl -X POST \
  -H "Authorization: Token <YOUR_TOKEN_HERE>" \
  -H "Content-Type: application/json" \
  -d '{
        "patient_id": 123,
        "triage_level": 2,
        "chief_complaint": "Forte dolore addominale",
        "initial_observation": "Paziente pallido e sudato.",
        "attending_physician_id": 10,
        "triage_nurse_id": 15
      }' \
  http://localhost:8004/api/emergency-visits/
```

3. **Retrieval of a specific visit**
```
curl -X GET \
  -H "Authorization: Token <YOUR_TOKEN_HERE>" \
  http://localhost:8004/api/emergency-visits/1/
```

4. **Updating an existing visit**
```
curl -X PATCH \
  -H "Authorization: Token <YOUR_TOKEN_HERE>" \
  -H "Content-Type: application/json" \
  -d '{
        "triage_level": 1,
        "initial_observation": "Paziente pallido, sudato, pressione bassa."
      }' \
  http://localhost:8004/api/emergency-visits/1/
```

5. **Deletion of a specific visit**
```
curl -X DELETE \
  -H "Authorization: Token <YOUR_TOKEN_HERE>" \
  http://localhost:8004/api/emergency-visits/1/
```

6. **Discharge of a visit**
```
curl -X PATCH \
  -H "Authorization: Token <YOUR_TOKEN_HERE>" \
  -H "Content-Type: application/json" \
  -d '{
        "discharge_diagnosis": "Appendicite acuta",
        "discharge_instructions": "Riposo e controllo tra 7 giorni."
      }' \
  http://localhost:8004/api/emergency-visits/1/discharge/
```

7. **List of all active visits**
```
curl -X GET \
  -H "Authorization: Token <YOUR_TOKEN_HERE>" \
  http://localhost:8004/api/emergency-visits/active/
```

8. **Visits' Statistics**
```
curl -X GET \
  -H "Authorization: Token <YOUR_TOKEN_HERE>" \
  http://localhost:8004/api/emergency-visits/stats/
```


## 📈 Vital signs API

1. **List of all vital signals**
```
curl -X GET \
  -H "Authorization: Token <YOUR_TOKEN_HERE>" \
  "http://localhost:8004/api/vital-signs/?visit_id=1"
```

2. **Creation of new vital signs**
```
curl -X POST \
  -H "Authorization: Token <YOUR_TOKEN_HERE>" \
  -H "Content-Type: application/json" \
  -d '{
        "visit": 1,
        "temperature": "38.5",
        "heart_rate": 110,
        "blood_pressure_systolic": 100,
        "blood_pressure_diastolic": 60,
        "respiratory_rate": 22,
        "oxygen_saturation": 95,
        "pain_level": 7,
        "notes": "Paziente febbricitante e tachicardico."
      }' \
  http://localhost:8004/api/vital-signs/
```

3. **Retrieval of specific vital signs**
```
curl -X GET \
  -H "Authorization: Token <YOUR_TOKEN_HERE>" \
  http://localhost:8004/api/vital-signs/1/
```

4. **Deletion of vital signs**
```
curl -X DELETE \
  -H "Authorization: Token <YOUR_TOKEN_HERE>" \
  http://localhost:8004/api/vital-signs/1/
```

## 💊 Treatments API

1. **List of all the treatments**
```
curl -X GET \
  -H "Authorization: Token <YOUR_TOKEN_HERE>" \
  "http://localhost:8004/api/treatments/?visit_id=1&treatment_type=MED"
```

2. **Create a new treatment**
```
curl -X POST \
  -H "Authorization: Token <YOUR_TOKEN_HERE>" \
  -H "Content-Type: application/json" \
  -d '{
        "visit": 1,
        "treatment_type": "MED",
        "name": "Paracetamolo",
        "description": "Antipiretico",
        "dosage": "1000mg",
        "outcome": "Febbre ridotta",
        "complications": "Nessuna"
      }' \
  http://localhost:8004/api/treatments/
```

3. **Retrieval of a specific treatment**
```
curl -X GET \
  -H "Authorization: Token <YOUR_TOKEN_HERE>" \
  http://localhost:8004/api/treatments/1/
``` 

4. **Update of a specific treatment**
```
curl -X PATCH \
  -H "Authorization: Token <YOUR_TOKEN_HERE>" \
  -H "Content-Type: application/json" \
  -d '{
        "outcome": "Febbre scomparsa",
        "complications": "Lieve nausea"
      }' \
  http://localhost:8004/api/treatments/1/
```

5. **Deletion of a treatment**
```
curl -X DELETE \
  -H "Authorization: Token <YOUR_TOKEN_HERE>" \
  http://localhost:8004/api/treatments/1/
```