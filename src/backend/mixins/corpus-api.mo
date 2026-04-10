import List "mo:core/List";
import Map "mo:core/Map";
import Set "mo:core/Set";
import CorpusLib "../lib/corpus";
import ContributorLib "../lib/contributor";
import CorpusTypes "../types/corpus";
import Common "../types/common";

mixin (
  corpus : List.List<CorpusTypes.CorpusEntry>,
  contributors : List.List<CorpusTypes.Contributor>,
  favorites : Map.Map<Common.UserId, Set.Set<Nat>>,
  getNextCorpusId : () -> Nat,
  setNextCorpusId : (Nat) -> (),
) {
  public shared ({ caller }) func addCorpusEntry(
    inpui : Text,
    english : Text,
    category : Text,
    tags : [Text],
    audioId : ?Text,
  ) : async Nat {
    let callerId = caller.toText();
    let currentId = getNextCorpusId();
    let newId = CorpusLib.addEntry(
      corpus, favorites, currentId,
      inpui, english, category, tags, audioId, callerId,
    );
    if (newId > 0) {
      setNextCorpusId(currentId + 1);
      ContributorLib.incrementContribution(contributors, callerId);
    };
    newId;
  };

  public query func getCorpusEntries() : async [CorpusTypes.CorpusEntry] {
    CorpusLib.getApprovedEntries(corpus);
  };

  public query func searchCorpus(searchTerm : Text, category : ?Text) : async [CorpusTypes.CorpusEntry] {
    CorpusLib.searchEntries(corpus, searchTerm, category);
  };

  public shared ({ caller = _ }) func toggleFavorite(entryId : Nat, userId : Text) : async Bool {
    CorpusLib.toggleFavorite(favorites, entryId, userId);
  };

  public query func getFavorites(userId : Text) : async [Nat] {
    CorpusLib.getFavorites(favorites, userId);
  };
};
