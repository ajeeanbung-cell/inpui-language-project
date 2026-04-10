import List "mo:core/List";
import ChatLib "../lib/chat";
import AdminLib "../lib/admin";
import ChatTypes "../types/chat";
import AdminTypes "../types/admin";
import Principal "mo:core/Principal";

mixin (
  chatMessages : List.List<ChatTypes.ChatMessage>,
  getNextMessageId : () -> Nat,
  setNextMessageId : (Nat) -> (),
  getAdminSettingsFn : () -> AdminTypes.AdminSettings,
) {
  public shared ({ caller }) func addChatMessage(
    entryId : Nat,
    authorName : Text,
    content : Text,
  ) : async { #ok : Nat; #err : Text } {
    if (caller.isAnonymous()) {
      return #err("Must be authenticated to post a message");
    };
    if (content.size() == 0) {
      return #err("Message cannot be empty");
    };
    if (content.size() > 500) {
      return #err("Message exceeds 500 character limit");
    };
    let id = getNextMessageId();
    let assignedId = ChatLib.addMessage(chatMessages, id, entryId, caller.toText(), authorName, content);
    setNextMessageId(id + 1);
    #ok(assignedId);
  };

  public query func getChatMessages(entryId : Nat) : async [ChatTypes.ChatMessage] {
    ChatLib.getMessages(chatMessages, entryId);
  };

  public shared ({ caller }) func deleteChatMessage(messageId : Nat) : async { #ok; #err : Text } {
    if (caller.isAnonymous()) {
      return #err("Must be authenticated");
    };
    let settings = getAdminSettingsFn();
    let callerIsAdmin = AdminLib.isAdmin(settings.adminPrincipals, caller.toText());
    let deleted = ChatLib.deleteMessage(chatMessages, messageId, caller.toText(), callerIsAdmin);
    if (deleted) { #ok } else { #err("Message not found or not authorized") };
  };
};
