package pl.research.backend.experiment;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "experiments")
public class Experiment {

    @Id
    private String id;

    private String name;
    private String description;
    private String ownerId;
    // Keep pre-sharing experiments visible after upgrading existing MongoDB documents.
    private boolean publiclyVisible = true;
    private boolean publiclyEditable;
    private Instant createdAt;

    public Experiment() {
    }

    public Experiment(String name, String description) {
        this(name, description, null, false, false);
    }

    public Experiment(String name, String description, String ownerId,
                      boolean publiclyVisible, boolean publiclyEditable) {
        this.name = name;
        this.description = description;
        this.ownerId = ownerId;
        this.publiclyVisible = publiclyVisible;
        this.publiclyEditable = publiclyEditable;
        this.createdAt = Instant.now();
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }

    public String getOwnerId() { return ownerId; }

    public boolean isPubliclyVisible() { return publiclyVisible; }

    public boolean isPubliclyEditable() { return publiclyEditable; }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setId(String id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setOwnerId(String ownerId) { this.ownerId = ownerId; }

    public void setPubliclyVisible(boolean publiclyVisible) { this.publiclyVisible = publiclyVisible; }

    public void setPubliclyEditable(boolean publiclyEditable) { this.publiclyEditable = publiclyEditable; }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
