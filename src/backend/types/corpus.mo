import Common "common";

module {
  public type CorpusEntry = {
    id : Nat;
    inpui : Text;
    english : Text;
    category : Text;
    tags : [Text];
    audioId : ?Text;
    audioStorageId : ?Text;
    addedBy : Common.UserId;
    timestamp : Common.Timestamp;
    isApproved : Bool;
  };

  public type Contributor = {
    id : Common.UserId;
    name : Text;
    contributionCount : Nat;
    isVerified : Bool;
    joinedAt : Common.Timestamp;
  };

  public type Stats = {
    totalEntries : Nat;
    activeContributors : Nat;
    queueSize : Nat;
    totalFavorites : Nat;
  };
};
