# Role-Based Permissions for Modules and SubModules

## Overview
This document describes the implementation of role-based permission filtering for modules and submodules in the ERP system.

## API Endpoints

### 1. Get Role ID by Role Name
**Endpoint:** `GET /api/role/byname/{roleName}`

**Description:** Retrieves the RoleId for a given role name.

**Response:**
```json
{
  "success": true,
  "message": "Role found",
  "roles": [
    {
      "id": 1,
      "role": "Admin"
    }
  ]
}
```

### 2. Get Modules by Role
**Endpoint:** `GET /api/module/role/{roleId}`

**Description:** Returns only modules that the specified role has permission to view (View or Full Access permission).

**Response:**
```json
{
  "success": true,
  "message": "Modules retrieved successfully",
  "modules": [
    {
      "id": 1,
      "moduleName": "Sales",
      "status": "Active"
    }
  ]
}
```

### 3. Get SubModules by Role
**Endpoint:** `GET /api/submodule/role/{roleId}?moduleId={moduleId}`

**Description:** Returns only submodules that the specified role has permission to view (View or Full Access permission). Optionally filtered by moduleId.

**Query Parameters:**
- `moduleId` (optional): Filter submodules by a specific module

**Response:**
```json
{
  "success": true,
  "message": "SubModules retrieved successfully",
  "subModules": [
    {
      "id": 1,
      "subModuleName": "Orders",
      "moduleId": 1,
      "moduleName": "Sales",
      "status": "Active"
    }
  ]
}
```

## Permission Types
The system filters modules/submodules based on the following permission types:
- **View**: User can view the module/submodule
- **Full Access**: User has full access to the module/submodule
- Any other permission type also grants view access

## Frontend Usage

### Getting Role ID from Role Name
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5165';
const user = JSON.parse(localStorage.getItem('user') || '{}');

// Get RoleId from Role name
const getRoleId = async (roleName) => {
  try {
    const response = await fetch(`${API_URL}/api/role/byname/${encodeURIComponent(roleName)}`);
    const data = await response.json();
    if (data.success && data.roles && data.roles.length > 0) {
      return data.roles[0].id;
    }
    return null;
  } catch (error) {
    console.error('Error getting role ID:', error);
    return null;
  }
};

const roleId = await getRoleId(user.Role);
```

### Fetching Modules by Role
```javascript
const fetchModulesByRole = async (roleId) => {
  try {
    const response = await fetch(`${API_URL}/api/module/role/${roleId}`);
    const data = await response.json();
    if (data.success) {
      return data.modules || [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching modules:', error);
    return [];
  }
};
```

### Fetching SubModules by Role
```javascript
const fetchSubModulesByRole = async (roleId, moduleId = null) => {
  try {
    const url = moduleId 
      ? `${API_URL}/api/submodule/role/${roleId}?moduleId=${moduleId}`
      : `${API_URL}/api/submodule/role/${roleId}`;
    
    const response = await fetch(url);
    const data = await response.json();
    if (data.success) {
      return data.subModules || [];
    }
    return [];
  } catch (error) {
    console.error('Error fetching submodules:', error);
    return [];
  }
};
```

## Implementation Notes

1. **Permission Filtering Logic:**
   - The system first fetches all permissions for the role
   - It creates a set of allowed module/submodule IDs
   - Then it filters the full list of modules/submodules to only include those with permissions

2. **Permission Types:**
   - Modules/submodules with "View" permission are included
   - Modules/submodules with "Full Access" permission are included
   - Any other permission type also grants view access

3. **Performance:**
   - The endpoints fetch permissions first, then filter modules/submodules
   - This ensures only authorized content is returned to the frontend

## Example Usage in Dashboard

```javascript
// In Dashboard component
useEffect(() => {
  const loadRoleBasedModules = async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.Role) return;
    
    // Get RoleId
    const roleId = await getRoleId(user.Role);
    if (!roleId) return;
    
    // Fetch modules and submodules filtered by role
    const modules = await fetchModulesByRole(roleId);
    const subModules = await fetchSubModulesByRole(roleId);
    
    // Update state with filtered data
    setModules(modules);
    setSubModules(subModules);
  };
  
  loadRoleBasedModules();
}, []);
```
