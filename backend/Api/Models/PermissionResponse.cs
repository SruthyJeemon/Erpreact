namespace Api.Models;

public class PermissionResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<PermissionData>? Permissions { get; set; }
}

public class PermissionData
{
    public int Id { get; set; }
    public int RoleId { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public int? ModuleId { get; set; }
    public string ModuleName { get; set; } = string.Empty;
    public int? SubModuleId { get; set; }
    public string SubModuleName { get; set; } = string.Empty;
    public string PermissionType { get; set; } = string.Empty; // Full Access, View, Create, Edit, Delete, Approve, All Record
    public string Status { get; set; } = string.Empty;
}