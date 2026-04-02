namespace Api.Models;

public class EditReasonResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<EditReasonData>? Data { get; set; }
}
