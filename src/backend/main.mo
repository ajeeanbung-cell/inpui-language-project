import List "mo:core/List";
import Map "mo:core/Map";
import Set "mo:core/Set";
import Time "mo:core/Time";
import CorpusTypes "types/corpus";
import QueueTypes "types/queue";
import PredictorTypes "types/predictor";
import AdminTypes "types/admin";
import ChatTypes "types/chat";
import Common "types/common";
import CorpusApi "mixins/corpus-api";
import QueueApi "mixins/queue-api";
import ContributorApi "mixins/contributor-api";
import PredictorApi "mixins/predictor-api";
import AdminApi "mixins/admin-api";
import ChatApi "mixins/chat-api";
import Migration "migration";

(with migration = Migration.run)
actor {
  let corpus = List.empty<CorpusTypes.CorpusEntry>();
  let contributors = List.empty<CorpusTypes.Contributor>();
  let favorites = Map.empty<Common.UserId, Set.Set<Nat>>();
  let translationQueue = List.empty<QueueTypes.QueueEntry>();
  let parallelQueue = List.empty<QueueTypes.ParallelUploadEntry>();
  let feedbacks = List.empty<PredictorTypes.PredictionFeedback>();
  let chatMessages = List.empty<ChatTypes.ChatMessage>();

  var nextCorpusId : Nat = 0;
  var nextQueueId : Nat = 0;
  var nextParallelId : Nat = 0;
  var nextMessageId : Nat = 0;

  var adminSettings : AdminTypes.AdminSettings = {
    upiId = "";
    qrCodeData = "";
    adminPrincipals = [];
  };

  // Seed sample corpus entries so the app is immediately useful
  let sampleEntries : [(Text, Text, Text, [Text])] = [
    ("Ka in u", "I am here", "greetings", ["greetings", "phrases"]),
    ("Ka ei deu", "I am hungry", "food", ["food", "phrases"]),
    ("A tui", "Water", "food", ["food", "nouns"]),
    ("Ka va", "I will go", "verbs", ["verbs", "movement"]),
    ("Ka ro", "I am coming", "verbs", ["verbs", "movement"]),
    ("Pa", "Father", "family", ["family", "nouns"]),
    ("Nu", "Mother", "family", ["family", "nouns"]),
    ("Khat", "One", "numbers", ["numbers"]),
    ("Hnih", "Two", "numbers", ["numbers"]),
    ("Thum", "Three", "numbers", ["numbers"]),
  ];

  do {
    var seedId = 0;
    let baseTime = Time.now();
    for ((inpui, english, category, tags) in sampleEntries.values()) {
      corpus.add({
        id = seedId;
        inpui;
        english;
        category;
        tags;
        audioId = null;
        audioStorageId = null;
        addedBy = "system";
        timestamp = baseTime - (seedId.toInt() * 1_000_000_000);
        isApproved = true;
      });
      seedId += 1;
    };
    nextCorpusId := seedId;
  };

  include CorpusApi(
    corpus, contributors, favorites,
    func() : Nat { nextCorpusId },
    func(n : Nat) { nextCorpusId := n },
  );
  include QueueApi(
    translationQueue, parallelQueue, corpus,
    func() : Nat { nextQueueId },
    func(n : Nat) { nextQueueId := n },
    func() : Nat { nextParallelId },
    func(n : Nat) { nextParallelId := n },
    func() : Nat { nextCorpusId },
    func(n : Nat) { nextCorpusId := n },
  );
  include ContributorApi(contributors);
  include PredictorApi(corpus, feedbacks);
  include AdminApi(
    corpus, contributors, favorites, translationQueue,
    func() : AdminTypes.AdminSettings { adminSettings },
    func(s : AdminTypes.AdminSettings) { adminSettings := s },
  );
  include ChatApi(
    chatMessages,
    func() : Nat { nextMessageId },
    func(n : Nat) { nextMessageId := n },
    func() : AdminTypes.AdminSettings { adminSettings },
  );
};
