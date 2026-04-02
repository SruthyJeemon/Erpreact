namespace Api.Models;

public class EmailSettingsRequest
{
    public int? Id { get; set; }
    public string? SmtpUsername { get; set; }
    public string? SmtpPassword { get; set; }
    public string? SmtpHost { get; set; }
    public string? ServerPort { get; set; }
}
