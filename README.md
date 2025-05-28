# Hospital Emergency Room Management System

## Overview

A comprehensive Django-based management system for hospital emergency departments, designed to streamline patient flow from triage through treatment to discharge or admission.

## Features

- **Patient Management**: Complete demographic and medical history tracking
- **Triage System**: 5-level triage with timestamps and priority management
- **Medical Records**: 
  - Vital signs tracking
  - Treatment documentation
  - Diagnosis recording (with ICD-10 codes)
- **Resource Management**:
  - Bed availability monitoring
  - Medical inventory control
- **Workflow Automation**:
  - Admission process from ER to hospital
  - Discharge procedures with prescription management
- **Staff Management**: Role-based access and shift tracking

## System Requirements

- Python 3.8+
- Django 3.2+
- PostgreSQL 12+ (recommended)
- Redis (for caching, optional)

## Installation

1. Clone the repository:
   git clone https://github.com/yourrepo/hospital-er-management.git
   cd Emergencies

2. Run:
   docker-compose up --build

3. Connect:
  http://localhost:8000/admin
