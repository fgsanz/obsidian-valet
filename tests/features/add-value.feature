Feature: Add value operation
  Adding a new value to a property, respecting whether the property allows
  multiple values, and never producing duplicates.

  Scenario: Append a link to notes with and existing not empty, existing and empty, and undefined property
    Given a fresh copy of the test vault
    When I filter notes in directory "Dir 1"
    And I apply add value on property "related" with value to add "[[New Topic]]"
    Then 3 notes are changed
    And note "Note A" has "[[New Topic]]" in "related"
    And note "Note A" has "[[Topic A]]" in "related"
    And note "Note B" has "[[New Topic]]" in "related"
    And note "Note C" has "[[New Topic]]" in "related"
    And the YAML of "Note A" is still valid

  Scenario: Adding a value that already exists changes nothing
    Given a fresh copy of the test vault
    When I filter notes where "related" "exists and contains" "[[Topic A]]"
    And I apply add value on property "related" with value to add "[[Topic A]]"
    Then 2 notes match
    And 0 notes are changed

  Scenario: Trying add a value to an existing single-value property which is not empty does not add the value
    Given a fresh copy of the test vault
    When I filter notes in directory "Dir 1"
    And I filter notes where "time" "exists and contains" "13:40"
    And 1 notes match
    Then I apply add value on property "time" with value to add "23:59"
    And 0 notes are changed
    And note "Note A" has property "time" equal to "13:40"

  Scenario: Adding a value to a single-value property that exists and is empty adds the value
    Given a fresh copy of the test vault
    When I filter notes in directory "Dir 1"
    And I filter notes where "time" "exists and is empty"
    And 1 notes match
    Then I apply add value on property "time" with value to add "23:59"
    And 1 notes are changed
    And note "Note B" has property "time" equal to "23:59"

Scenario: Adding a value to a single-value property that does not exist adds the value
    Given a fresh copy of the test vault
    When I filter notes in directory "Dir 1"
    And I filter notes where "time" "does not exist"
    And 1 notes match
    Then I apply add value on property "time" with value to add "23:59"
    And 1 notes are changed
    And note "Note C" has property "time" equal to "23:59"

Scenario: Trying add a link note to a property that is boolean does not add the value
    Given a fresh copy of the test vault
    When I filter notes in directory "Dir 1"
    And I filter notes where "read" "exists and contains" "true"
    And 1 notes match
    Then I apply add value on property "read" with value to add "[[Some note]]"
    And 0 notes are changed
    And note "Note A" has property "read" equal to "true"

Scenario: Trying add a plain text value to a property that is a link-array does not add the value
    Given a fresh copy of the test vault
    When I filter notes in directory "Dir 1"
    And I filter notes where "related" "exists and is empty"
    And 1 notes match
    Then I apply add value on property "related" with value to add "Some plain text"
    And 0 notes are changed
    And note "Note B" has property "related" and it is empty
