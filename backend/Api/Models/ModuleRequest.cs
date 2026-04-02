namespace Api.Models;

public class ModuleRequest
{
    public int? Id { get; set; }
    public string ModuleName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int? RoleId { get; set; }
    public int Query { get; set; } // 1=Insert, 2=Update, 3=SelectAll, 4=Delete, 5=Search, 6=GetByRoleId
}