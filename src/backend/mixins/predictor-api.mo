import List "mo:core/List";
import PredictorLib "../lib/predictor";
import CorpusTypes "../types/corpus";
import PredictorTypes "../types/predictor";

mixin (
  corpus : List.List<CorpusTypes.CorpusEntry>,
  feedbacks : List.List<PredictorTypes.PredictionFeedback>,
) {
  public query func getPredictions(text : Text) : async [(CorpusTypes.CorpusEntry, Float)] {
    PredictorLib.getPredictions(corpus, feedbacks, text);
  };

  public shared ({ caller }) func submitPredictionFeedback(
    entryId : Nat,
    predictedTranslation : Text,
    isCorrect : Bool,
  ) : async Bool {
    PredictorLib.submitFeedback(feedbacks, entryId, predictedTranslation, isCorrect, caller.toText());
  };
};
