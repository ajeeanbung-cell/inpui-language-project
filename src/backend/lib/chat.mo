import ChatTypes "../types/chat";
import List "mo:core/List";
import Time "mo:core/Time";
import Int "mo:core/Int";

module {
  public func addMessage(
    messages : List.List<ChatTypes.ChatMessage>,
    nextId : Nat,
    entryId : Nat,
    authorId : Text,
    authorName : Text,
    content : Text,
  ) : Nat {
    let msg : ChatTypes.ChatMessage = {
      id = nextId;
      entryId;
      authorId;
      authorName;
      content;
      timestamp = Time.now();
      isDeleted = false;
    };
    messages.add(msg);
    nextId;
  };

  public func getMessages(
    messages : List.List<ChatTypes.ChatMessage>,
    entryId : Nat,
  ) : [ChatTypes.ChatMessage] {
    let filtered = messages.filter(func(m : ChatTypes.ChatMessage) : Bool {
      m.entryId == entryId and not m.isDeleted
    });
    // Sort ascending by timestamp
    let sorted = filtered.sort(func(a : ChatTypes.ChatMessage, b : ChatTypes.ChatMessage) : { #less; #equal; #greater } {
      Int.compare(a.timestamp, b.timestamp)
    });
    sorted.toArray();
  };

  public func deleteMessage(
    messages : List.List<ChatTypes.ChatMessage>,
    messageId : Nat,
    callerPrincipal : Text,
    isAdmin : Bool,
  ) : Bool {
    var found = false;
    messages.mapInPlace(func(m : ChatTypes.ChatMessage) : ChatTypes.ChatMessage {
      if (m.id == messageId and not m.isDeleted) {
        if (m.authorId == callerPrincipal or isAdmin) {
          found := true;
          { m with isDeleted = true };
        } else {
          m;
        };
      } else {
        m;
      };
    });
    found;
  };
};
