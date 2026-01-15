
class Adapter:
    def validate(self, actual, expected):
        try:
            return sorted(actual) == sorted(expected)
        except Exception:
            # Fallback if sorting fails (e.g. incompatible types), though shouldn't happen for this adapter's use case
            return False
