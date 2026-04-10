import Common "common";

module {
  public type ChatMessage = {
    id : Nat;
    entryId : Nat;
    authorId : Common.UserId;
    authorName : Text;
    content : Text;
    timestamp : Common.Timestamp;
    isDeleted : Bool;
  };
};
