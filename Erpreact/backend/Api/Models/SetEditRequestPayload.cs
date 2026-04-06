namespace Api.Models;

/// <summary>Legacy Saveseteditcomments — Sp_Variantsetcomments Q1 (Set + Editrequest).</summary>
public class SetEditRequestPayload
{
    public string? Productid { get; set; }
    public string? Userid { get; set; }
    public string? SetId { get; set; }
    public string? Comments { get; set; }
}
