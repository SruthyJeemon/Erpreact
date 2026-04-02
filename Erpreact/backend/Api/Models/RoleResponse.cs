namespace Api.Models;

public class RoleResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<RoleData>? Roles { get; set; }
}

public class RoleData
{
    public int Id { get; set; }
    public string Role { get; set; } = string.Empty;
}