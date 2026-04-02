namespace Api.Models;

public class UserRegistrationResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<RegistrationUserData>? Users { get; set; }
}

public class RegistrationUserData
{
    public int Id { get; set; }
    public string? Userid { get; set; }
    public string? Firstname { get; set; }
    public string? Lastname { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Role { get; set; }
    public string? Catelogid { get; set; }
    public string? Dateofregister { get; set; }
    public string? Profile_image { get; set; }
    public string? Status { get; set; }
    public string? Warehouseid { get; set; }
}
