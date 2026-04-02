namespace Api.Models;

public class UserRegistrationRequest
{
    public int? Id { get; set; }
    public string? Userid { get; set; }
    public string? Firstname { get; set; }
    public string? Lastname { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Password { get; set; }
    public string? Role { get; set; } // Comma-separated for multiple roles
    public string? Catelogid { get; set; } // Comma-separated for multiple catalogs
    public string? Dateofregister { get; set; }
    public string? Profile_image { get; set; } // Base64 or URL
    public string? Status { get; set; }
    public string? Warehouseid { get; set; }
    public int Query { get; set; } = 1; // 1=Insert, 2=Update, 3=Select All, 4=Delete, 5=Select by ID
}
