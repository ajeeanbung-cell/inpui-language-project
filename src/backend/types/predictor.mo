import Common "common";

module {
  public type PredictionFeedback = {
    entryId : Nat;
    predictedTranslation : Text;
    isCorrect : Bool;
    userId : Common.UserId;
    timestamp : Common.Timestamp;
  };

  public type PredictionResult = {
    entry : {
      id : Nat;
      inpui : Text;
      english : Text;
      category : Text;
      tags : [Text];
      audioId : ?Text;
      addedBy : Common.UserId;
      timestamp : Common.Timestamp;
      isApproved : Bool;
    };
    confidence : Float;
  };
};
