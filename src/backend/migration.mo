import List "mo:core/List";
import Map "mo:core/Map";
import Set "mo:core/Set";
import AdminTypes "types/admin";
import CorpusTypes "types/corpus";
import QueueTypes "types/queue";
import PredictorTypes "types/predictor";
import Common "types/common";

module {
  // Old types (from previous version)
  type OldCorpusEntry = {
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

  type OldAdminSettings = {
    upiId : Text;
    qrCodeData : Text;
    adminPrincipal : Text;
  };

  type OldActor = {
    corpus : List.List<OldCorpusEntry>;
    contributors : List.List<CorpusTypes.Contributor>;
    favorites : Map.Map<Common.UserId, Set.Set<Nat>>;
    translationQueue : List.List<QueueTypes.QueueEntry>;
    parallelQueue : List.List<QueueTypes.ParallelUploadEntry>;
    feedbacks : List.List<PredictorTypes.PredictionFeedback>;
    var nextCorpusId : Nat;
    var nextQueueId : Nat;
    var nextParallelId : Nat;
    var adminSettings : OldAdminSettings;
  };

  type NewActor = {
    corpus : List.List<CorpusTypes.CorpusEntry>;
    contributors : List.List<CorpusTypes.Contributor>;
    favorites : Map.Map<Common.UserId, Set.Set<Nat>>;
    translationQueue : List.List<QueueTypes.QueueEntry>;
    parallelQueue : List.List<QueueTypes.ParallelUploadEntry>;
    feedbacks : List.List<PredictorTypes.PredictionFeedback>;
    var nextCorpusId : Nat;
    var nextQueueId : Nat;
    var nextParallelId : Nat;
    var adminSettings : AdminTypes.AdminSettings;
  };

  public func run(old : OldActor) : NewActor {
    // Migrate corpus entries: add audioStorageId = null
    let corpus = old.corpus.map<OldCorpusEntry, CorpusTypes.CorpusEntry>(
      func(e) {
        { e with audioStorageId = null };
      }
    );

    // Migrate adminSettings: adminPrincipal -> adminPrincipals
    let adminSettings : AdminTypes.AdminSettings = {
      upiId = old.adminSettings.upiId;
      qrCodeData = old.adminSettings.qrCodeData;
      adminPrincipals = if (old.adminSettings.adminPrincipal == "") {
        []
      } else {
        [old.adminSettings.adminPrincipal]
      };
    };

    {
      corpus;
      contributors = old.contributors;
      favorites = old.favorites;
      translationQueue = old.translationQueue;
      parallelQueue = old.parallelQueue;
      feedbacks = old.feedbacks;
      var nextCorpusId = old.nextCorpusId;
      var nextQueueId = old.nextQueueId;
      var nextParallelId = old.nextParallelId;
      var adminSettings;
    };
  };
};
