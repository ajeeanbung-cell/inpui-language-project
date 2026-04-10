import List "mo:core/List";
import Map "mo:core/Map";
import Set "mo:core/Set";
import AdminLib "../lib/admin";
import CorpusLib "../lib/corpus";
import ContributorLib "../lib/contributor";
import AdminTypes "../types/admin";
import CorpusTypes "../types/corpus";
import QueueTypes "../types/queue";
import Common "../types/common";
import Principal "mo:core/Principal";

mixin (
  corpus : List.List<CorpusTypes.CorpusEntry>,
  contributors : List.List<CorpusTypes.Contributor>,
  favorites : Map.Map<Common.UserId, Set.Set<Nat>>,
  translationQueue : List.List<QueueTypes.QueueEntry>,
  getAdminSettingsFn : () -> AdminTypes.AdminSettings,
  setAdminSettingsFn : (AdminTypes.AdminSettings) -> (),
) {
  public query func getAdminSettings() : async AdminTypes.AdminSettings {
    getAdminSettingsFn();
  };

  public shared ({ caller }) func updateAdminSettings(upiId : Text, qrCodeData : Text) : async Bool {
    let settings = getAdminSettingsFn();
    if (not AdminLib.isAdmin(settings.adminPrincipals, caller.toText())) {
      return false;
    };
    let updated = AdminLib.updateSettings(settings, upiId, qrCodeData);
    setAdminSettingsFn(updated);
    true;
  };

  public query ({ caller }) func exportCorpus() : async [CorpusTypes.CorpusEntry] {
    let settings = getAdminSettingsFn();
    if (not AdminLib.isAdmin(settings.adminPrincipals, caller.toText())) {
      return [];
    };
    AdminLib.exportCorpus(corpus);
  };

  public query func getStats() : async CorpusTypes.Stats {
    let totalFavs = favorites.foldLeft(
      0,
      func(acc : Nat, _k : Common.UserId, v : Set.Set<Nat>) : Nat { acc + v.size() },
    );
    {
      totalEntries = corpus.size();
      activeContributors = contributors.size();
      queueSize = translationQueue.size();
      totalFavorites = totalFavs;
    };
  };

  public query func getAdminPrincipals() : async [Text] {
    getAdminSettingsFn().adminPrincipals;
  };

  public shared ({ caller }) func addAdminPrincipal(principal : Text) : async { #ok; #err : Text } {
    let settings = getAdminSettingsFn();
    if (not AdminLib.isAdmin(settings.adminPrincipals, caller.toText())) {
      return #err("Not authorized");
    };
    let updated = AdminLib.addAdmin(settings, principal);
    setAdminSettingsFn(updated);
    #ok;
  };

  public shared ({ caller }) func removeAdminPrincipal(principal : Text) : async { #ok; #err : Text } {
    let settings = getAdminSettingsFn();
    if (not AdminLib.isAdmin(settings.adminPrincipals, caller.toText())) {
      return #err("Not authorized");
    };
    switch (AdminLib.removeAdmin(settings, principal)) {
      case null { #err("Cannot remove the last admin") };
      case (?updated) {
        setAdminSettingsFn(updated);
        #ok;
      };
    };
  };

  public shared ({ caller }) func autoSetFirstAdmin() : async () {
    let settings = getAdminSettingsFn();
    let updated = AdminLib.autoSetFirstAdmin(settings, caller.toText());
    setAdminSettingsFn(updated);
  };

  public query ({ caller }) func isCallerAdmin() : async Bool {
    let settings = getAdminSettingsFn();
    AdminLib.isAdmin(settings.adminPrincipals, caller.toText());
  };

  public shared ({ caller }) func updateCorpusEntry(
    id : Nat,
    inpui : Text,
    english : Text,
    category : Text,
    tags : [Text],
  ) : async { #ok; #err : Text } {
    let settings = getAdminSettingsFn();
    if (not AdminLib.isAdmin(settings.adminPrincipals, caller.toText())) {
      return #err("Not authorized");
    };
    var found = false;
    corpus.mapInPlace(func(e : CorpusTypes.CorpusEntry) : CorpusTypes.CorpusEntry {
      if (e.id == id) {
        found := true;
        { e with inpui; english; category; tags };
      } else {
        e;
      };
    });
    if (found) { #ok } else { #err("Entry not found") };
  };

  public shared ({ caller }) func deleteCorpusEntry(id : Nat) : async { #ok : ?Text; #err : Text } {
    let settings = getAdminSettingsFn();
    if (not AdminLib.isAdmin(settings.adminPrincipals, caller.toText())) {
      return #err("Not authorized");
    };
    var audioStorageId : ?Text = null;
    var found = false;
    // Find the audioStorageId before removal
    switch (corpus.find(func(e : CorpusTypes.CorpusEntry) : Bool { e.id == id })) {
      case (?entry) {
        audioStorageId := entry.audioStorageId;
        found := true;
      };
      case null {};
    };
    if (not found) {
      return #err("Entry not found");
    };
    // Remove entry from corpus in-place by filtering
    let toRemove = corpus.filter(func(e : CorpusTypes.CorpusEntry) : Bool { e.id != id });
    corpus.clear();
    corpus.append(toRemove);
    #ok(audioStorageId);
  };
};
