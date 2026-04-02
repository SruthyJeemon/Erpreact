namespace Api.Models;

public class LoginResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public UserData? User { get; set; }
}

public class UserData
{
    public int Id { get; set; }
    public string Userid { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string Lastlogindate { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Catelogid { get; set; } = string.Empty;
}
