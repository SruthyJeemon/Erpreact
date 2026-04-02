namespace Api.Models;

public class RoleRequest
{
    public int? Id { get; set; }
    public string Role { get; set; } = string.Empty;
    public int Query { get; set; } // 1=Insert, 2=Update, 3=SelectAll, 4=Delete, 5=Search
}