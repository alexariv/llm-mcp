import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpRequest.BodyPublishers;

public class server_test {
    public static void main(String[] args) throws Exception {
        String json = """
            {
              "name": "search",
              "args": {
                "index": "*",
                "query": "id"
              }
            }
            """;

        HttpClient client = HttpClient.newHttpClient();

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:3000/elasticsearch/search"))
                .header("Content-Type", "application/json")
                .POST(BodyPublishers.ofString(json))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

        System.out.println("Status code: " + response.statusCode());
        System.out.println("Response: " + response.body());
    }
}
