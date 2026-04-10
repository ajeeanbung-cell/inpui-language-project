import Types "../types/admin";
import CorpusTypes "../types/corpus";
import List "mo:core/List";
import Array "mo:core/Array";

module {
  public func getSettings(settings : Types.AdminSettings) : Types.AdminSettings {
    settings;
  };

  public func updateSettings(
    currentSettings : Types.AdminSettings,
    upiId : Text,
    qrCodeData : Text,
  ) : Types.AdminSettings {
    { currentSettings with upiId; qrCodeData };
  };

  public func exportCorpus(corpus : List.List<CorpusTypes.CorpusEntry>) : [CorpusTypes.CorpusEntry] {
    corpus.toArray();
  };

  public func isAdmin(adminPrincipals : [Text], caller : Text) : Bool {
    adminPrincipals.find(func(p : Text) : Bool { p == caller }) != null;
  };

  public func addAdmin(
    currentSettings : Types.AdminSettings,
    principal : Text,
  ) : Types.AdminSettings {
    // Avoid duplicates
    if (isAdmin(currentSettings.adminPrincipals, principal)) {
      return currentSettings;
    };
    { currentSettings with adminPrincipals = currentSettings.adminPrincipals.concat([principal]) };
  };

  public func removeAdmin(
    currentSettings : Types.AdminSettings,
    principal : Text,
  ) : ?Types.AdminSettings {
    let filtered = currentSettings.adminPrincipals.filter(func(p : Text) : Bool { p != principal });
    // Prevent removing last admin
    if (filtered.size() == 0) {
      return null;
    };
    ?{ currentSettings with adminPrincipals = filtered };
  };

  public func autoSetFirstAdmin(
    currentSettings : Types.AdminSettings,
    caller : Text,
  ) : Types.AdminSettings {
    if (currentSettings.adminPrincipals.size() == 0) {
      { currentSettings with adminPrincipals = [caller] };
    } else {
      currentSettings;
    };
  };
};
