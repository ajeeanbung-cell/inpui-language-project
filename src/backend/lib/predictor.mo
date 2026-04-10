import List "mo:core/List";
import Time "mo:core/Time";
import CorpusTypes "../types/corpus";
import PredictorTypes "../types/predictor";
import Common "../types/common";

module {
  func tokenize(text : Text) : [Text] {
    let words = text.toLower().split(#char ' ');
    words.toArray();
  };

  func countMatchingWords(tokens : [Text], target : Text) : Nat {
    let targetTokens = tokenize(target);
    var count = 0;
    for (token in tokens.values()) {
      if (token.size() > 1 and targetTokens.find(func(t) { t == token }) != null) {
        count += 1;
      };
    };
    count;
  };

  public func getPredictions(
    corpus : List.List<CorpusTypes.CorpusEntry>,
    _feedbacks : List.List<PredictorTypes.PredictionFeedback>,
    text : Text,
  ) : [(CorpusTypes.CorpusEntry, Float)] {
    if (text.size() == 0) { return [] };

    let tokens = tokenize(text);
    let tokenCount = tokens.size();

    // Build (entry, confidence) pairs for approved entries with matching words
    let candidates = List.empty<(CorpusTypes.CorpusEntry, Float)>();
    corpus.forEach(func(entry) {
      if (not entry.isApproved) { return };
      let inpuiMatches = countMatchingWords(tokens, entry.inpui);
      let englishMatches = countMatchingWords(tokens, entry.english);
      let bestMatches = if (inpuiMatches > englishMatches) inpuiMatches else englishMatches;
      if (bestMatches > 0) {
        let maxWords = if (tokenCount > 1) tokenCount else 1;
        let confidence = (bestMatches.toFloat() / maxWords.toFloat()) * 100.0;
        candidates.add((entry, confidence));
      };
    });

    // Sort by confidence descending
    let arr = candidates.toArray();
    let sorted = arr.sort(func(a, b) {
      if (b.1 > a.1) { #less } else if (b.1 < a.1) { #greater } else { #equal };
    });

    // Return top 5
    sorted.sliceToArray(0, if (sorted.size() < 5) sorted.size() else 5);
  };

  public func submitFeedback(
    feedbacks : List.List<PredictorTypes.PredictionFeedback>,
    entryId : Nat,
    predictedTranslation : Text,
    isCorrect : Bool,
    caller : Common.UserId,
  ) : Bool {
    feedbacks.add({
      entryId;
      predictedTranslation;
      isCorrect;
      userId = caller;
      timestamp = Time.now();
    });
    true;
  };
};
