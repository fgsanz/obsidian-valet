Feature: Move value operation
  Moving a value from one property to another: it is removed from the source and added to
  the target, provided the value is valid for the target property's type.

  Scenario: Move a note link from one link-array property to another
    Given a fresh copy of the test vault
    When I filter notes where "parent" "exists and contains" "[[Note X]]"
    And I apply move value from property "parent" to property "related" value to move "[[Note X]]"
    Then 2 notes are changed
    And note "Note A" no longer has "[[Note X]]" in "parent"
    And note "Note A" has "[[Note X]]" in "related"
    And note "Note A" has "[[Topic A]]" in "related"
    And the YAML of "Note A" is still valid

  Scenario: Moving a value not present in the source property changes nothing
    Given a fresh copy of the test vault
    When I filter notes where "parent" "exists and contains" "[[Note X]]"
    And I apply move value from property "parent" to property "related" value to move "[[Not There]]"
    Then 0 notes are changed
    And note "Note A" has "[[Note X]]" in "parent"

  Scenario: Moving into a target property of an incompatible type is rejected
    Given a fresh copy of the test vault
    When I filter notes where "parent" "exists and contains" "[[Note X]]"
    And I apply move value from property "parent" to property "date" value to move "[[Note X]]"
    Then 0 notes are changed
    And note "Note A" has "[[Note X]]" in "parent"
    And note "Note A" has property "date" equal to "2025-12-31"
