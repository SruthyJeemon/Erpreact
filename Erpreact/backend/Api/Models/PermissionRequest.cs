namespace Api.Models;

public class PermissionRequest
{
    public int? Id { get; set; }
    public int RoleId { get; set; }
    public int? ModuleId { get; set; }
    public int? SubModuleId { get; set; }
    public string PermissionType { get; set; } = string.Empty; // Full Access, View, Create, Edit, Delete, Approve, All Record
    public string Status { get; set; } = string.Empty;
    public int Query { get; set; } // 1=Insert, 2=Update, 3=SelectAll, 4=Delete, 5=GetByRole, 6=GetByRoleAndModule
}