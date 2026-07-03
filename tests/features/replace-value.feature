Feature: Replace value operation
  Replacing a specific value with a new one across matching notes, respecting the
  property type and leaving the YAML frontmatter valid.

  Scenario: Replace a note link in a link-array property
    Given a fresh copy of the test vault
    When I filter notes where "parent" "exists and contains" "[[Note X]]"
    And I apply replace value on property "parent" current value "[[Note X]]" new value "[[Note Q]]"
    Then 2 notes are changed
    And note "Note A" no longer has "[[Note X]]" in "parent"
    And note "Note A" has "[[Note Q]]" in "parent"
    And note "Note A" has "[[Note Y|Y notes]]" in "parent"
    And the YAML of "Note A" is still valid

  Scenario: Replace the value of a single-value text property
    Given a fresh copy of the test vault
    When I filter notes where "number headings" "exists and contains" "auto, first-level 1, max 3, contents ^toc, 1.1"
    And I apply replace value on property "number headings" current value "auto, first-level 1, max 3, contents ^toc, 1.1" new value "auto, max 2"
    Then 2 notes are changed
    And note "Note A" has property "number headings" equal to "auto, max 2"

  Scenario: Replacing a value that is not present changes nothing
    Given a fresh copy of the test vault
    When I filter notes where "parent" "exists and contains" "[[Note X]]"
    And I apply replace value on property "parent" current value "[[Not There]]" new value "[[Whatever]]"
    Then 0 notes are changed
    And note "Note A" has "[[Note X]]" in "parent"

  Scenario: Replacing with a value of the wrong type is rejected
    Given a fresh copy of the test vault
    When I filter notes where "parent" "exists and contains" "[[Note X]]"
    And I apply replace value on property "parent" current value "[[Note X]]" new value "Some plain text"
    Then 0 notes are changed
    And note "Note A" has "[[Note X]]" in "parent"

  Scenario: Replace a value in a text-array property
    Given a fresh copy of the test vault
    When I filter notes where "aliases" "exists and contains" "alias 2"
    And I apply replace value on property "aliases" current value "alias 2" new value "alias two"
    Then 2 notes are changed
    And note "Note A" has "alias two" in "aliases"
    And note "Note A" no longer has "alias 2" in "aliases"

  Scenario: Replacing a boolean value writes an unquoted boolean, not a quoted string
    Given a fresh copy of the test vault
    When I filter notes where "parent" "exists and contains" "[[Note X]]"
    And I apply replace value on property "read" current value "true" new value "false"
    Then 2 notes are changed
    And note "Note A" has property "read" equal to "false"
    And note "Note D" has property "read" equal to "false"
    And the YAML of "Note A" is still valid
