import List "mo:core/List";
import QueueLib "../lib/queue";
import QueueTypes "../types/queue";
import CorpusTypes "../types/corpus";

mixin (
  translationQueue : List.List<QueueTypes.QueueEntry>,
  parallelQueue : List.List<QueueTypes.ParallelUploadEntry>,
  corpus : List.List<CorpusTypes.CorpusEntry>,
  getNextQueueId : () -> Nat,
  setNextQueueId : (Nat) -> (),
  getNextParallelId : () -> Nat,
  setNextParallelId : (Nat) -> (),
  getNextCorpusId : () -> Nat,
  setNextCorpusId : (Nat) -> (),
) {
  public shared ({ caller }) func addToQueue(inpui : ?Text, english : ?Text, source : Text) : async Nat {
    let id = QueueLib.addToQueue(translationQueue, corpus, getNextQueueId(), inpui, english, source, caller.toText());
    setNextQueueId(getNextQueueId() + 1);
    id;
  };

  public shared ({ caller }) func addBulkToQueue(entries : [(?Text, ?Text)], source : Text) : async Nat {
    let count = QueueLib.addBulkToQueue(translationQueue, corpus, getNextQueueId(), entries, source, caller.toText());
    setNextQueueId(getNextQueueId() + count);
    count;
  };

  public query func getQueue() : async [QueueTypes.QueueEntry] {
    QueueLib.getQueueEntries(translationQueue);
  };

  public shared ({ caller = _ }) func removeFromQueue(id : Nat) : async Bool {
    QueueLib.removeFromQueue(translationQueue, id);
  };

  public shared ({ caller }) func approveQueueEntry(
    id : Nat,
    inpui : Text,
    english : Text,
    category : Text,
    tags : [Text],
  ) : async Nat {
    let corpusId = QueueLib.approveQueueEntry(
      translationQueue, corpus, getNextCorpusId(),
      id, inpui, english, category, tags, caller.toText(),
    );
    setNextCorpusId(getNextCorpusId() + 1);
    corpusId;
  };

  public shared ({ caller }) func submitParallelEntries(entries : [(Text, Text)]) : async Nat {
    let count = QueueLib.submitParallelEntries(parallelQueue, getNextParallelId(), entries, caller.toText());
    setNextParallelId(getNextParallelId() + count);
    count;
  };

  public query func getPendingParallelEntries() : async [QueueTypes.ParallelUploadEntry] {
    QueueLib.getPendingParallelEntries(parallelQueue);
  };

  public shared ({ caller = _ }) func approveParallelEntry(id : Nat) : async Bool {
    let ok = QueueLib.approveParallelEntry(parallelQueue, corpus, getNextCorpusId(), id, "admin");
    if (ok) { setNextCorpusId(getNextCorpusId() + 1) };
    ok;
  };

  public shared ({ caller = _ }) func rejectParallelEntry(id : Nat) : async Bool {
    QueueLib.rejectParallelEntry(parallelQueue, id);
  };
};
