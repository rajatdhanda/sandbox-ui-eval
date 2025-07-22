#!/bin/bash
# scripts/test-crud-operations.sh
# Path: scripts/test-crud-operations.sh

# Test CRUD operations at API level using curl
# Make sure to update the auth token and URLs as needed

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:3000/api"
SUPABASE_URL="https://eldgobpkssjngjabkoyz.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsZGdvYnBrc3NqbmdqYWJrb3l6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjIxNjc4NCwiZXhwIjoyMDY3NzkyNzg0fQ.7QgcSvcPfElB0T9fj6kcUWY4IQ1Fbmkz8S1RE4ADiaQ"

echo -e "${YELLOW}🧪 Testing CRUD Operations${NC}\n"

# Test 1: Create Parent-Child Relationship
echo -e "${YELLOW}1. Testing Parent-Child Relationship CREATE${NC}"
curl -X POST "$SUPABASE_URL/rest/v1/parent_child_relationships" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "parent_id": "PARENT_UUID_HERE",
    "child_id": "CHILD_UUID_HERE",
    "relationship_type": "parent",
    "is_primary": true,
    "created_at": "'$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")'",
    "is_active": true
  }' | jq '.'

echo -e "\n${YELLOW}2. Testing Class Assignment CREATE${NC}"
curl -X POST "$SUPABASE_URL/rest/v1/class_assignments" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "teacher_id": "TEACHER_UUID_HERE",
    "class_id": "CLASS_UUID_HERE",
    "role": "primary",
    "start_date": "2025-07-14",
    "created_at": "'$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")'",
    "is_active": true
  }' | jq '.'

echo -e "\n${YELLOW}3. Testing Curriculum Assignment CREATE${NC}"
curl -X POST "$SUPABASE_URL/rest/v1/curriculum_assignments" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "curriculum_id": "CURRICULUM_UUID_HERE",
    "class_id": "CLASS_UUID_HERE",
    "start_date": "2025-07-14",
    "created_at": "'$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")'",
    "is_active": true
  }' | jq '.'

echo -e "\n${YELLOW}4. Testing READ operations${NC}"
echo "Reading parent-child relationships:"
curl -X GET "$SUPABASE_URL/rest/v1/parent_child_relationships?select=*,parent:users!parent_id(full_name),child:children!child_id(first_name,last_name)&is_active=eq.true" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" | jq '.'

echo -e "\n${YELLOW}5. Testing UPDATE (soft delete)${NC}"
# First, get an ID to update
RELATIONSHIP_ID="YOUR_RELATIONSHIP_ID_HERE"
curl -X PATCH "$SUPABASE_URL/rest/v1/parent_child_relationships?id=eq.$RELATIONSHIP_ID" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "is_active": false,
    "updated_at": "'$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")'"
  }' | jq '.'

echo -e "\n${YELLOW}6. Testing Hard DELETE${NC}"
curl -X DELETE "$SUPABASE_URL/rest/v1/parent_child_relationships?id=eq.$RELATIONSHIP_ID" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" | jq '.'

echo -e "\n${YELLOW}7. Testing RLS Policies${NC}"
# Check if we can read without auth
curl -X GET "$SUPABASE_URL/rest/v1/parent_child_relationships" \
  -H "apikey: $SUPABASE_ANON_KEY" | jq '.'

echo -e "\n${GREEN}✅ CRUD Tests Complete${NC}"