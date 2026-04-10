import List "mo:core/List";
import Time "mo:core/Time";
import Int "mo:core/Int";
import QueueTypes "../types/queue";
import CorpusTypes "../types/corpus";
import Common "../types/common";

module {
  // Check if an (inpui, english) pair is a duplicate in corpus
  func isDupInCorpus(corpus : List.List<CorpusTypes.CorpusEntry>, inpui : ?Text, _english : ?Text) : Bool {
    switch (inpui) {
      case (?i) {
        let lower = i.toLower();
        corpus.any(func(e) { e.inpui.toLower() == lower });
      };
      case null { false };
    };
  };

  // Check if duplicate already exists in queue
  func isDupInQueue(queue : List.List<QueueTypes.QueueEntry>, inpui : ?Text, english : ?Text) : Bool {
    switch (inpui) {
      case (?i) {
        let lower = i.toLower();
        queue.any(func(e) {
          switch (e.inpui) {
            case (?qi) { qi.toLower() == lower };
            case null { false };
          };
        });
      };
      case null {
        switch (english) {
          case (?en) {
            let lower = en.toLower();
            queue.any(func(e) {
              switch (e.english) {
                case (?qe) { qe.toLower() == lower };
                case null { false };
              };
            });
          };
          case null { false };
        };
      };
    };
  };

  public func addToQueue(
    queue : List.List<QueueTypes.QueueEntry>,
    corpus : List.List<CorpusTypes.CorpusEntry>,
    nextId : Nat,
    inpui : ?Text,
    english : ?Text,
    source : Text,
    caller : Common.UserId,
  ) : Nat {
    let dupCorpus = isDupInCorpus(corpus, inpui, english);
    let dupQueue = isDupInQueue(queue, inpui, english);
    let entry : QueueTypes.QueueEntry = {
      id = nextId;
      inpui;
      english;
      source;
      submittedBy = caller;
      timestamp = Time.now();
      isDuplicate = dupCorpus or dupQueue;
    };
    queue.add(entry);
    nextId;
  };

  public func addBulkToQueue(
    queue : List.List<QueueTypes.QueueEntry>,
    corpus : List.List<CorpusTypes.CorpusEntry>,
    nextId : Nat,
    entries : [(inpui : ?Text, english : ?Text)],
    source : Text,
    caller : Common.UserId,
  ) : Nat {
    var count = 0;
    var currentId = nextId;
    for ((inpui, english) in entries.values()) {
      let dupCorpus = isDupInCorpus(corpus, inpui, english);
      let dupQueue = isDupInQueue(queue, inpui, english);
      // Skip exact duplicates that are already in corpus and queue
      if (not (dupCorpus and dupQueue)) {
        let entry : QueueTypes.QueueEntry = {
          id = currentId;
          inpui;
          english;
          source;
          submittedBy = caller;
          timestamp = Time.now();
          isDuplicate = dupCorpus or dupQueue;
        };
        queue.add(entry);
        currentId += 1;
        count += 1;
      };
    };
    count;
  };

  public func getQueueEntries(queue : List.List<QueueTypes.QueueEntry>) : [QueueTypes.QueueEntry] {
    let arr = queue.toArray();
    arr.sort(func(a, b) { Int.compare(b.timestamp, a.timestamp) });
  };

  public func removeFromQueue(queue : List.List<QueueTypes.QueueEntry>, id : Nat) : Bool {
    let before = queue.size();
    let filtered = queue.filter(func(e) { e.id != id });
    queue.clear();
    queue.append(filtered);
    queue.size() < before;
  };

  public func approveQueueEntry(
    queue : List.List<QueueTypes.QueueEntry>,
    corpus : List.List<CorpusTypes.CorpusEntry>,
    nextCorpusId : Nat,
    id : Nat,
    inpui : Text,
    english : Text,
    category : Text,
    tags : [Text],
    caller : Common.UserId,
  ) : Nat {
    // Remove from queue
    let filtered = queue.filter(func(e) { e.id != id });
    queue.clear();
    queue.append(filtered);

    // Add to corpus
    let entry : CorpusTypes.CorpusEntry = {
      id = nextCorpusId;
      inpui;
      english;
      category;
      tags;
      audioId = null;
      audioStorageId = null;
      addedBy = caller;
      timestamp = Time.now();
      isApproved = true;
    };
    corpus.add(entry);
    nextCorpusId;
  };

  public func submitParallelEntries(
    parallelQueue : List.List<QueueTypes.ParallelUploadEntry>,
    nextId : Nat,
    entries : [(Text, Text)],
    caller : Common.UserId,
  ) : Nat {
    var count = 0;
    var currentId = nextId;
    for ((inpui, english) in entries.values()) {
      let entry : QueueTypes.ParallelUploadEntry = {
        id = currentId;
        inpui;
        english;
        submittedBy = caller;
        timestamp = Time.now();
        status = "pending";
      };
      parallelQueue.add(entry);
      currentId += 1;
      count += 1;
    };
    count;
  };

  public func getPendingParallelEntries(
    parallelQueue : List.List<QueueTypes.ParallelUploadEntry>
  ) : [QueueTypes.ParallelUploadEntry] {
    parallelQueue.filter(func(e) { e.status == "pending" }).toArray();
  };

  public func approveParallelEntry(
    parallelQueue : List.List<QueueTypes.ParallelUploadEntry>,
    corpus : List.List<CorpusTypes.CorpusEntry>,
    nextCorpusId : Nat,
    id : Nat,
    approvedBy : Common.UserId,
  ) : Bool {
    var found = false;
    parallelQueue.mapInPlace(func(e) {
      if (e.id == id and e.status == "pending") {
        found := true;
        // Add to corpus
        let corpusEntry : CorpusTypes.CorpusEntry = {
          id = nextCorpusId;
          inpui = e.inpui;
          english = e.english;
          category = "general";
          tags = [];
          audioId = null;
          audioStorageId = null;
          addedBy = approvedBy;
          timestamp = Time.now();
          isApproved = true;
        };
        corpus.add(corpusEntry);
        { e with status = "approved" };
      } else { e };
    });
    found;
  };

  public func rejectParallelEntry(
    parallelQueue : List.List<QueueTypes.ParallelUploadEntry>,
    id : Nat,
  ) : Bool {
    var found = false;
    parallelQueue.mapInPlace(func(e) {
      if (e.id == id and e.status == "pending") {
        found := true;
        { e with status = "rejected" };
      } else { e };
    });
    found;
  };
};
