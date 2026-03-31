#!/bin/bash

# Firebase Emulator URLs
AUTH_URL="http://localhost:9099"
FIRESTORE_URL="http://localhost:8080"
PROJECT_ID="tracker-6a648"

# Admin users to create
USERS=(
    "user@test.com:user"
    "admin@test.com:admin"
    "superadmin@test.com:superadmin"
)

PASSWORD="AngryLion"

echo "🚀 Adding admin users to Firebase Emulator..."

# Function to create user in Auth
create_auth_user() {
    local email=$1
    local password=$2
    
    echo "Creating Auth user: $email"
    
    # Create user in Firebase Auth
    AUTH_RESPONSE=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$email\",
            \"password\": \"$password\",
            \"returnSecureToken\": true
        }" \
        "http://localhost:9099/identitytoolkit/v1/projects/$PROJECT_ID/accounts:signUp")
    
    echo "Auth Response: $AUTH_RESPONSE"
    
    # Extract user ID from response
    USER_ID=$(echo "$AUTH_RESPONSE" | grep -o '"localId":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$USER_ID" ]; then
        echo "✅ Created Auth user: $email (ID: $USER_ID)"
        return 0
    else
        echo "❌ Failed to create Auth user: $email"
        return 1
    fi
}

# Function to add user to Firestore admins collection
add_to_admins() {
    local email=$1
    local role=$2
    local user_id=$3
    
    echo "Adding to Firestore admins: $email (role: $role)"
    
    # Add to admins collection
    FIRESTORE_RESPONSE=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "{
            \"fields\": {
                \"email\": {\"stringValue\": \"$email\"},
                \"role\": {\"stringValue\": \"$role\"},
                \"userId\": {\"stringValue\": \"$user_id\"},
                \"createdAt\": {\"timestampValue\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}
            }
        }" \
        "http://localhost:8080/v1/projects/$PROJECT_ID/databases/(default)/documents/admins")
    
    echo "Firestore Response: $FIRESTORE_RESPONSE"
    
    if echo "$FIRESTORE_RESPONSE" | grep -q '"name"'; then
        echo "✅ Added to Firestore admins: $email"
        return 0
    else
        echo "❌ Failed to add to Firestore admins: $email"
        return 1
    fi
}

# Main execution
for user_info in "${USERS[@]}"; do
    IFS=':' read -r email role <<< "$user_info"
    
    echo ""
    echo "=== Processing: $email ==="
    
    # Create user in Auth
    if create_auth_user "$email" "$PASSWORD"; then
        # Add to Firestore admins
        add_to_admins "$email" "$role" "$USER_ID"
    fi
done

echo ""
echo "🎉 Admin user creation complete!"
echo ""
echo "📋 Summary:"
echo "- Firebase Auth Emulator: http://localhost:9099"
echo "- Firestore Emulator: http://localhost:8080"
echo "- Emulator UI: http://localhost:4000"
echo "- SPA Server: http://localhost:8016"
echo ""
echo "🔑 Test credentials:"
echo "- user@test.com / AngryLion (user role)"
echo "- admin@test.com / AngryLion (admin role)"
echo "- superadmin@test.com / AngryLion (superadmin role)" 