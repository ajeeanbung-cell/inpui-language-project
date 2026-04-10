import List "mo:core/List";
import Map "mo:core/Map";
import Set "mo:core/Set";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Types "../types/corpus";
import Common "../types/common";

module {
  public func addEntry(
    corpus : List.List<Types.CorpusEntry>,
    _favorites : Map.Map<Common.UserId, Set.Set<Nat>>,
    nextId : Nat,
    inpui : Text,
    english : Text,
    category : Text,
    tags : [Text],
    audioId : ?Text,
    caller : Text,
  ) : Nat {
    // Duplicate detection: same inpui text (case-insensitive)
    let lowerInpui = inpui.toLower();
    let isDup = corpus.any(func(e) { e.inpui.toLower() == lowerInpui });
    if (isDup) { return 0 };

    let entry : Types.CorpusEntry = {
      id = nextId;
      inpui;
      english;
      category;
      tags;
      audioId;
      audioStorageId = null;
      addedBy = caller;
      timestamp = Time.now();
      isApproved = true;
    };
    corpus.add(entry);
    nextId;
  };

  public func getApprovedEntries(corpus : List.List<Types.CorpusEntry>) : [Types.CorpusEntry] {
    let approved = corpus.filter(func(e) { e.isApproved });
    // Sort by timestamp descending
    let arr = approved.toArray();
    arr.sort(func(a, b) { Int.compare(b.timestamp, a.timestamp) });
  };

  public func searchEntries(
    corpus : List.List<Types.CorpusEntry>,
    searchTerm : Text,
    category : ?Text,
  ) : [Types.CorpusEntry] {
    let lower = searchTerm.toLower();
    let filtered = corpus.filter(func(e : Types.CorpusEntry) : Bool {
      if (not e.isApproved) { return false };
      let matchesText = lower == "" or
        e.inpui.toLower().contains(#text lower) or
        e.english.toLower().contains(#text lower);
      let matchesCategory = switch (category) {
        case null { true };
        case (?cat) { e.category.toLower() == cat.toLower() };
      };
      matchesText and matchesCategory;
    });
    let arr = filtered.toArray();
    arr.sort(func(a, b) { Int.compare(b.timestamp, a.timestamp) });
  };

  public func toggleFavorite(
    favorites : Map.Map<Common.UserId, Set.Set<Nat>>,
    entryId : Nat,
    userId : Common.UserId,
  ) : Bool {
    let current = switch (favorites.get(userId)) {
      case (?s) { s };
      case null {
        let s = Set.empty<Nat>();
        favorites.add(userId, s);
        s;
      };
    };
    if (current.contains(entryId)) {
      current.remove(entryId);
      false;
    } else {
      current.add(entryId);
      true;
    };
  };

  public func getFavorites(
    favorites : Map.Map<Common.UserId, Set.Set<Nat>>,
    userId : Common.UserId,
  ) : [Nat] {
    switch (favorites.get(userId)) {
      case (?s) { s.toArray() };
      case null { [] };
    };
  };

  public func totalFavoritesCount(favorites : Map.Map<Common.UserId, Set.Set<Nat>>) : Nat {
    favorites.foldLeft(0, func(acc, _k, v) { acc + v.size() });
  };
};
