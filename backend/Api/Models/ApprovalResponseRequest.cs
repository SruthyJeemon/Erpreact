namespace Api.Models;

public class ApprovalResponseRequest
{
    public string? Productid { get; set; }
    public string? Userid { get; set; }
    public string? Approved_Userid { get; set; }
    public string? Status { get; set; }
    public string? Comments { get; set; }
}
