@Entity
public class User {
    private String name;

    @Id
    @GeneratedValue
    private long id;
}