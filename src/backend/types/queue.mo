import Common "common";

module {
  public type QueueEntry = {
    id : Nat;
    inpui : ?Text;
    english : ?Text;
    source : Text;
    submittedBy : Common.UserId;
    timestamp : Common.Timestamp;
    isDuplicate : Bool;
  };

  public type ParallelUploadEntry = {
    id : Nat;
    inpui : Text;
    english : Text;
    submittedBy : Common.UserId;
    timestamp : Common.Timestamp;
    status : Text;
  };
};
