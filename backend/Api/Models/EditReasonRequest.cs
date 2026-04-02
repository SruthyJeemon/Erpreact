namespace Api.Models;

public class EditReasonRequest
{
    public string? Productid { get; set; }
    public string? Userid { get; set; }
    public string? Editreason { get; set; }
    public string? Adddate { get; set; }
    public string? Type { get; set; }
    public int Status { get; set; }
    public string? Approved_userid { get; set; }
}

public class EditReasonData
{
    public int Id { get; set; }
    public string Productid { get; set; } = string.Empty;
    public string Userid { get; set; } = string.Empty;
    public string Editreason { get; set; } = string.Empty;
    public string Adddate { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public int Status { get; set; }
    public string? Approved_userid { get; set; }
    
    // Display properties
    public string? ProductName { get; set; }
    public string? UserName { get; set; }
}
